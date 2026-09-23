import { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User";
import { Rider } from "../models/Rider";
import { issueOtp, verifyOtp } from "../services/otpService";
import { signAccessToken, signRefreshToken } from "../services/jwtService";
import { telegramService } from "../services/telegramService";
import { hashSecret, verifySecret } from "../utils/hash";
import { AppError } from "../middleware/errorHandler";

const requestOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  role: z.enum(["CUSTOMER", "RIDER"]),
});

/**
 * Requests an OTP for login/registration. The code itself is
 * returned in the response ONLY because this MVP explicitly does
 * not use SMS — verification happens inside the NagarGo app UI
 * (per spec). This is a deliberate, documented product decision,
 * not an accidental leak: there is no SMS provider in this build,
 * so the app itself is the delivery channel for the code.
 */
export async function requestOtp(req: Request, res: Response) {
  const { phone } = requestOtpSchema.parse(req.body);

  const { code, expiresInSeconds } = await issueOtp(phone, "LOGIN_OR_REGISTER");

  res.json({
    message: "Verification code generated.",
    // In a production build with a real SMS/WhatsApp channel, this
    // field would be removed and the code sent out-of-band instead.
    devDisplayCode: code,
    expiresInSeconds,
  });
}

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  code: z.string().min(4).max(8),
  role: z.enum(["CUSTOMER", "RIDER"]),
  name: z.string().min(1).optional(), // required for first-time customer registration
});

export async function verifyOtpAndLogin(req: Request, res: Response) {
  const { phone, code, role, name } = verifyOtpSchema.parse(req.body);

  await verifyOtp(phone, "LOGIN_OR_REGISTER", code);

  if (role === "CUSTOMER") {
    let user = await User.findOne({ phone });
    const isNewUser = !user;

    if (!user) {
      if (!name) {
        throw new AppError("Name is required to complete registration.", 400);
      }
      user = await User.create({ phone, name, isPhoneVerified: true });
      telegramService.events.customerRegistered({ publicId: user.publicId, name: user.name, phone: user.phone });
    } else {
      user.isPhoneVerified = true;
      await user.save();
    }

    if (user.status === "SUSPENDED") {
      throw new AppError("This account has been suspended. Contact support.", 403);
    }

    const payload = { sub: String(user._id), role: "CUSTOMER" as const };
    telegramService.events.userLogin({ publicId: user.publicId, role: "CUSTOMER" });

    res.json({
      isNewUser,
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: { id: user._id, publicId: user.publicId, name: user.name, phone: user.phone },
    });
    return;
  }

  // RIDER
  const rider = await Rider.findOne({ phone });
  if (!rider) {
    throw new AppError("No rider account found for this number. Please register as a rider first.", 404);
  }
  if (rider.status === "SUSPENDED" || rider.status === "REJECTED") {
    throw new AppError(`Your rider account is ${rider.status.toLowerCase()}. Reason: ${rider.rejectionReason ?? "No reason was provided."} Contact support if you have questions.`, 403);
  }

  const payload = { sub: String(rider._id), role: "RIDER" as const };
  telegramService.events.userLogin({ publicId: rider.publicId, role: "RIDER" });

  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    rider: { id: rider._id, publicId: rider.publicId, name: rider.fullName, status: rider.status },
  });
}

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_.]+$/i, "Username can only contain letters, numbers, dots and underscores."),
  password: z.string().min(8).max(72),
  photoUrl: z.string().min(1, "A profile photo is required."),
  location: z.object({
    address: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
  }),
});

/**
 * Password-based signup, offered alongside the OTP flow above (not
 * instead of it) — the phone number still goes through the same OTP
 * verification the rest of the app relies on for pickup/delivery
 * confirmation, it just happens right after account creation here
 * rather than gating it.
 *
 * Photo and location are required here at the request-validation
 * layer only, not on the User schema itself — the OTP quick-login
 * path above creates minimal accounts (name + phone) and must keep
 * working unchanged.
 */
export async function signup(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);

  const existing = await User.findOne({ $or: [{ phone: body.phone }, { email: body.email }, { username: body.username.toLowerCase() }] });
  if (existing) {
    const field = existing.phone === body.phone ? "phone number" : existing.email === body.email ? "email" : "username";
    throw new AppError(`An account with this ${field} already exists. Try signing in instead.`, 409);
  }

  const passwordHash = await hashSecret(body.password);
  const user = await User.create({
    name: body.name,
    phone: body.phone,
    email: body.email,
    username: body.username.toLowerCase(),
    passwordHash,
    profileImageUrl: body.photoUrl,
    location: body.location,
  });

  telegramService.events.customerRegistered({ publicId: user.publicId, name: user.name, phone: user.phone });

  const payload = { sub: String(user._id), role: "CUSTOMER" as const };
  res.status(201).json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user._id, publicId: user.publicId, name: user.name, phone: user.phone, email: user.email, username: user.username, profileImageUrl: user.profileImageUrl, location: user.location },
  });
}

const loginPasswordSchema = z.object({
  identifier: z.string().min(3).max(100), // phone, email, or username
  password: z.string().min(1).max(72),
});

/**
 * Password login for customers, matching against phone, email, or
 * username — whichever the identifier looks like. Riders and admins
 * keep their existing OTP / PIN flows unchanged.
 */
export async function loginWithPassword(req: Request, res: Response) {
  const { identifier, password } = loginPasswordSchema.parse(req.body);
  const normalized = identifier.trim().toLowerCase();

  const user = await User.findOne({
    $or: [{ phone: identifier.trim() }, { email: normalized }, { username: normalized }],
  }).select("+passwordHash");

  if (!user || !user.passwordHash || !(await verifySecret(user.passwordHash, password))) {
    throw new AppError("Incorrect phone/email/username or password.", 401);
  }
  if (user.status === "SUSPENDED") {
    throw new AppError("This account has been suspended. Contact support.", 403);
  }

  const payload = { sub: String(user._id), role: "CUSTOMER" as const };
  telegramService.events.userLogin({ publicId: user.publicId, role: "CUSTOMER" });

  res.json({
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user._id, publicId: user.publicId, name: user.name, phone: user.phone, email: user.email, username: user.username },
  });
}
