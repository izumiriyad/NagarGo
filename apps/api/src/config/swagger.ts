import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const PRODUCTION_URL = process.env.API_BASE_URL ?? "";

const servers = [
  ...(PRODUCTION_URL
    ? [{ url: `${PRODUCTION_URL}/api`, description: "Production API" }]
    : []),
  { url: "http://localhost:4000/api", description: "Local Development" },
];

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "NagarGo API",
      version: "1.0.0",
      description:
        "NagarGo is a production-ready hyperlocal delivery platform for Rajshahi, Bangladesh. " +
        "This API powers customer booking, rider dispatch, payment verification, medicine express orders, " +
        "real-time GPS tracking, dispute resolution, and admin operations.",
      contact: {
        name: "NagarGo Support",
        email: "support@nagargo.com",
        url: process.env.APP_BASE_URL ?? "http://localhost:3000",
      },
      license: {
        name: "Proprietary — All rights reserved",
        url: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/legal/terms`,
      },
    },
    servers,
    externalDocs: {
      description: "Full deployment guide",
      url: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/README.md`,
    },
    tags: [
      { name: "Auth",         description: "Customer authentication — signup, login, token refresh" },
      { name: "Orders",       description: "Order lifecycle — create, track, OTP, receipt, rating" },
      { name: "Riders",       description: "Rider registration, dispatch, location, earnings" },
      { name: "Payments",     description: "Payment config, transaction submission and verification" },
      { name: "Disputes",     description: "Customer dispute filing and admin resolution" },
      { name: "Medicine",     description: "Medicine Express order flow" },
      { name: "Notifications",description: "In-app notification inbox" },
      { name: "Admin",        description: "Admin dashboard — riders, orders, users, pricing, flags, audit" },
      { name: "Upload",       description: "File upload (profile photos, NID docs, prescriptions)" },
      { name: "Cities",       description: "City / service area management" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Obtain a JWT via `POST /api/auth/login` or `POST /api/auth/signup` and pass it here.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string", example: "Order not found." },
            status:  { type: "integer", example: 404 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { color: #0B1220; font-family: system-ui, sans-serif; }
        .swagger-ui .scheme-container { background: #f7f7f2; border-radius: 8px; }
      `,
      customSiteTitle: "NagarGo API Portal",
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: false,
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
      },
    })
  );

  // Expose the raw OpenAPI JSON spec for tooling / Postman import
  app.get("/api/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
