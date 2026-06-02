class Module:
    def __init__(self): pass
    def eval(self): pass

class Linear:
    def __init__(self, in_features, out_features):
        self.weight = self
        self.bias = self
        
    def fill_(self, val): 
        pass

    # 🌟 THIS FIXES THE CRASH: Allows the model to execute self.linear(x) smoothly
    def __call__(self, x):
        return x
