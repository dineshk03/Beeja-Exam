import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-module';

async function fixQuestionPaperIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('questionpapers');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));

    // Drop the old unique index on code if it exists
    try {
      await collection.dropIndex('code_1');
      console.log('Dropped old unique index on code field');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index code_1 does not exist, skipping drop');
      } else {
        console.error('Error dropping index:', error.message);
      }
    }

    // Drop the existing non-unique compound index and create a unique one
    try {
      await collection.dropIndex('exam_1_code_1');
      console.log('Dropped existing non-unique compound index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Compound index does not exist, skipping drop');
      } else {
        console.error('Error dropping compound index:', error.message);
      }
    }

    // Create the new compound unique index
    try {
      await collection.createIndex({ exam: 1, code: 1 }, { unique: true });
      console.log('Created new compound unique index on exam and code');
    } catch (error) {
      if (error.code === 85) {
        console.log('Compound unique index already exists');
      } else {
        console.error('Error creating compound index:', error.message);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
fixQuestionPaperIndex();
