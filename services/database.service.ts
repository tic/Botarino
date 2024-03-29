import { MongoClient } from 'mongodb';
import { config } from '../config';

export const isObjectId = (str: string) => !!str.match(/[0-9a-f]{24}/);

export const client = new MongoClient(
  `mongodb+srv://${
    config.mongo.username
  }:${
    config.mongo.password
  }@${
    config.mongo.url
  }/${
    config.mongo.primaryDatabase
  }?retryWrites=true&w=majority`,
  {
    serverSelectionTimeoutMS: 10000,
  },
);

export const collections = {
  reminders: client.db(config.mongo.primaryDatabase).collection('reminders'),
  serverEngagements: client.db(config.mongo.primaryDatabase).collection('serverEngagements'),
  gifs: client.db(config.mongo.primaryDatabase).collection('gifs'),
};
