import mongoose from "mongoose";

const EnrichedProductsSchema = new mongoose.Schema({
  raw_product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RawProduct', required: true },
  status: { type: Boolean, required: true },
  enriched_at: { type: Date, required: true },
  enriched_value: {
    type: new mongoose.Schema(
      {
        product_name: { type: String, default: "" },
        categories: { type: String, default: "" },
        countries: { type: String, default: "" },
        eco_score: { type: String, default: "" },
        nutriscore: { type: String, default: "" },
        image_url: { type: String, default: "" },
        code: { type: String, default: "" }
      },
      { _id: false }
    ),
    required: true,
  },
});

export default mongoose.models.EnrichedProduct ||
  mongoose.model("EnrichedProduct", EnrichedProductsSchema);