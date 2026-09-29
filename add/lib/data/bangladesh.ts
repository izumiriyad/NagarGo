export interface Division {
  name: string;
  bnName: string;
  districts: string[];
}

export const divisions: Division[] = [
  {
    name: 'Dhaka',
    bnName: 'ঢাকা',
    districts: ['Dhaka', 'Gazipur', 'Narayanganj', 'Manikganj', 'Munshiganj', 'Narsingdi', 'Tangail', 'Kishoreganj', 'Faridpur', 'Rajbari', 'Gopalganj', 'Madaripur', 'Shariatpur'],
  },
  {
    name: 'Chattogram',
    bnName: 'চট্টগ্রাম',
    districts: ['Chattogram', 'Cox\u2019s Bazar', 'Comilla', 'Brahmanbaria', 'Chandpur', 'Lakshmipur', 'Noakhali', 'Feni', 'Khagrachhari', 'Rangamati', 'Bandarban'],
  },
  {
    name: 'Rajshahi',
    bnName: 'রাজশাহী',
    districts: ['Rajshahi', 'Natore', 'Nawabganj', 'Naogaon', 'Bogura', 'Pabna', 'Sirajganj', 'Joypurhat'],
  },
  {
    name: 'Khulna',
    bnName: 'খুলনা',
    districts: ['Khulna', 'Bagerhat', 'Satkhira', 'Jessore', 'Jhenaidah', 'Magura', 'Narail', 'Chuadanga', 'Kushtia', 'Meherpur', 'Jashore'],
  },
  {
    name: 'Barishal',
    bnName: 'বরিশাল',
    districts: ['Barishal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
  },
  {
    name: 'Sylhet',
    bnName: 'সিলেট',
    districts: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  },
  {
    name: 'Rangpur',
    bnName: 'রংপুর',
    districts: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Nilphamari', 'Panchagarh', 'Thakurgaon', 'Lalmonirhat', 'Joypurhat'],
  },
  {
    name: 'Mymensingh',
    bnName: 'ময়মনসিংহ',
    districts: ['Mymensingh', 'Netrokona', 'Jamalpur', 'Sherpur'],
  },
];

export const allDistricts = divisions.flatMap((d) => d.districts);
