export const LAYOUT_SECTION_CONFIG: {
    field:    string; // property schema field name
    singular: string; // section name prefix e.g. "Bedroom"
}[] = [
    { field: 'bedrooms',  singular: 'Bedroom'  },
    { field: 'bathrooms', singular: 'Bathroom' },
    { field: 'garage',    singular: 'Garage'   },
    // future: { field: 'balconies',    singular: 'Balcony'      },
    // future: { field: 'storageRooms', singular: 'Storage Room' },
];
