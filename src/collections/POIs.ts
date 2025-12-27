import type { CollectionConfig } from 'payload'

export const POIs: CollectionConfig = {
  slug: 'pois',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Public read
    create: ({ req: { user } }) => !!user, // Authenticated users can create
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins can update any POI
      if (user.role === 'admin') return true
      // Regular users cannot update POIs (they are read-only)
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      // Only admins can delete POIs
      return user.role === 'admin'
    },
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
  ],
  timestamps: true,
}





