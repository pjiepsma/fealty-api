import type { CollectionConfig } from 'payload'

export const POIs: CollectionConfig = {
  slug: 'pois',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier for the POI (e.g., OSM ID)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name of the POI',
      },
    },
    {
      name: 'coordinates',
      type: 'point',
      required: true,
      index: true, // Create geospatial index
      admin: {
        description: 'Geographic coordinates (longitude, latitude)',
      },
    },
    {
      name: 'latitude',
      type: 'number',
      required: true,
      admin: {
        description: 'Latitude (for easier querying)',
      },
    },
    {
      name: 'longitude',
      type: 'number',
      required: true,
      admin: {
        description: 'Longitude (for easier querying)',
      },
    },
    {
      name: 'type',
      type: 'text',
      required: true,
      admin: {
        description: 'POI type (e.g., park, church, monument)',
      },
    },
    {
      name: 'category',
      type: 'text',
      required: true,
      admin: {
        description: 'POI category (e.g., leisure, religion, tourism)',
      },
    },
    {
      name: 'currentKing',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'User who currently has the most seconds at this POI',
        readOnly: true,
      },
    },
    {
      name: 'city',
      type: 'text',
      index: true,
      admin: {
        description: 'City name where the POI is located',
      },
    },
    {
      name: 'country',
      type: 'text',
      index: true,
      admin: {
        description: 'Country name where the POI is located',
      },
    },
  ],
  timestamps: true,
}






