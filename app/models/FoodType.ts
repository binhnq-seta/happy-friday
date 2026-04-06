// @ts-nocheck
import mongoose from 'mongoose';

const FoodTypeSchema = new mongoose.Schema({
    name: String,
    isActive: Boolean
});

const FoodType = mongoose.models.FoodType || mongoose.model('FoodType', FoodTypeSchema);

export default FoodType;