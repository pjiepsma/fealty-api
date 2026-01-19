// Note: This file should be added to the existing POIs collection
// Add the tileId field to the fields array

import type { CollectionConfig } from 'payload'

export const POIs: CollectionConfig = {
  slug: 'pois',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    // ... existing fields ...
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'coordinates',
      type: 'point',
      required: true,
    },
    {
      name: 'latitude',
      type: 'number',
      required: true,
    },
    {
      name: 'longitude',
      type: 'number',
      required: true,
    },
    {
      name: 'type',
      type: 'text',
      required: true,
    },
    {
      name: 'category',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'wikipedia',
      type: 'text',
    },
    {
      name: 'city',
      type: 'text',
      localized: true,
      admin: {
        description: 'City where the POI is located',
      },
    },
    {
      name: 'country',
      type: 'text',
      localized: true,
      admin: {
        description: 'Country where the POI is located',
      },
    },
    {
      name: 'tileId',
      type: 'text',
      admin: {
        description: 'Mapbox tile ID at zoom 14 (format: "zoom/x/y")',
      },
      index: true, // Index for fast queries
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
  ],
  timestamps: true,
}
