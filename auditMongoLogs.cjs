const mongoose = require('mongoose');

async function audit() {
  await mongoose.connect('mongodb://localhost:27017/agriadvisor');
  const db = mongoose.connection.db;
  
  const cropCount = await db.collection('crop_prediction_log').countDocuments();
  const irrigCount = await db.collection('irrigation_prediction_log').countDocuments();
  
  console.log(`[MongoDB Audit] crop_prediction_log count: ${cropCount}`);
  console.log(`[MongoDB Audit] irrigation_prediction_log count: ${irrigCount}`);

  if (cropCount > 0) {
    const sampleCrop = await db.collection('crop_prediction_log').findOne({}, { sort: { timestamp: -1 } });
    console.log('[Sample Crop Prediction Log]:', {
      recommended_crop: sampleCrop.recommended_crop,
      confidence: sampleCrop.confidence,
      trained_on: sampleCrop.trained_on,
      input_features: sampleCrop.input_features
    });
  }

  if (irrigCount > 0) {
    const sampleIrrig = await db.collection('irrigation_prediction_log').findOne({}, { sort: { timestamp: -1 } });
    console.log('[Sample Irrigation Prediction Log]:', {
      recommended_action: sampleIrrig.recommended_action,
      urgency_level: sampleIrrig.urgency_level,
      trained_on: sampleIrrig.trained_on,
      top_reasons: sampleIrrig.top_reasons
    });
  }

  await mongoose.disconnect();
}

audit().catch(console.error);
