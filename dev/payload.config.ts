import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import {
  advancedSeoPlugin,
  MetaDescriptionField,
  MetaImageField,
  MetaJsonLdField,
  MetaPreviewField,
  MetaTitleField,
} from 'advanced-seo-plugin'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { testEmailAdapter } from './helpers/testEmailAdapter.js'
import { seed } from './seed.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URL = `${memoryDB.getUri()}&retryWrites=true`
  }

  return buildConfig({
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [
      {
        slug: 'posts',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        slug: 'properties',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
        ],
      },
      {
        slug: 'pages',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            type: 'tabs',
            tabs: [
              {
                fields: [
                  {
                    name: 'content',
                    type: 'richText',
                  },
                ],
                label: 'Hero',
              },
              {
                fields: [
                  MetaTitleField({
                    hasGenerateFn: true,
                  }),
                  MetaDescriptionField({}),
                  MetaImageField({}),
                  MetaPreviewField({}),
                  MetaJsonLdField({}),
                ],
                label: 'SEO',
              },
            ],
          },
        ],
      },
      {
        slug: 'media',
        fields: [],
        upload: {
          staticDir: path.resolve(dirname, 'media'),
        },
      },
    ],
    db: mongooseAdapter({
      url: process.env.DATABASE_URL || '',
    }),
    editor: lexicalEditor(),
    email: testEmailAdapter,
    onInit: async (payload) => {
      await seed(payload)
    },
    plugins: [
      advancedSeoPlugin({
        collections: {
          posts: true,
        },
        tabbedUI: true,
      }),
    ],
    secret: process.env.PAYLOAD_SECRET || 'test-secret_key',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
