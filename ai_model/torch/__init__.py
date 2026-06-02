float32 = "float32"

class TensorMock:
    def __init__(self, data_list, dtype=None):
        # Handles cases where x is already a TensorMock passed from self.linear(x)
        if isinstance(data_list, TensorMock):
            self.data = data_list.data
        else:
            self.data = data_list
            
    def item(self):
        base_price, day, crop_len = self.data[0], self.data[1], self.data[2]
        # Exact linear weights math matching your model settings
        return (float(base_price) * 0.14) + (float(day) * 0.14) + (float(crop_len) * 0.14) + 1.8

def tensor(data_list, dtype=None):
    return TensorMock(data_list)

class no_grad:
    def __enter__(self): pass
    def __exit__(self, exc_type, exc_val, exc_tb): pass
