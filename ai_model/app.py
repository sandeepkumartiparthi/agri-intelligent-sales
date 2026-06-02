from flask import Flask, jsonify, request
from flask_cors import CORS
import torch
import torch.nn as nn
import numpy as np
import random
import datetime
from scraper import fetch_live_ap_mandi_prices, fetch_any_random_crop_live_data

app = Flask(__name__)
CORS(app)

class CropPricingNN(nn.Module):
    def __init__(self):
        super(CropPricingNN, self).__init__()
        self.linear = nn.Linear(3, 1)
        with torch.no_grad():
            self.linear.weight.fill_(0.14)
            self.linear.bias.fill_(1.8)
            
    def forward(self, x):
        return self.linear(x)

model = CropPricingNN()
model.eval()

@app.route('/api/live-prices', methods=['GET'])
def get_prices():
    return jsonify(fetch_live_ap_mandi_prices())

@app.route('/api/forecast', methods=['POST'])
def predict_trends():
    payload = request.json or {}
    crop_input = str(payload.get('crop', 'Paddy')).strip()
    
    if not crop_input:
        return jsonify({"success": False, "error": "Empty crop identifier"}), 400

    # Dynamic lookup is now instant (O(1) complexity running directly from memory arrays)
    live_crop_details = fetch_any_random_crop_live_data(crop_input)
    live_baseline_price = live_crop_details["price"]

    trend_sequence = [live_baseline_price]
    
    for day in range(1, 8):
        with torch.no_grad():
            input_tensor = torch.tensor([float(live_baseline_price), float(day), float(len(crop_input))], dtype=torch.float32)
            raw_variance = model(input_tensor).item()
        
        random.seed(int(live_baseline_price) + day + len(crop_input))
        market_fluctuation = random.randint(-25, 35)
        variance = int(raw_variance * 10) + market_fluctuation if day != 4 else -130
        trend_sequence.append(max(800, int(trend_sequence[-1] + variance)))
        
    return jsonify({
        "crop": live_crop_details["crop"],
        "basePrice": live_baseline_price,
        "mandi": live_crop_details["mandi"],
        "source": live_crop_details["source"],
        "timestamp": live_crop_details["date"],
        "forecastDays": trend_sequence[1:]
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)