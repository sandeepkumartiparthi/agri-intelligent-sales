import sys

class NumPyMock(object):
    pass

sys.modules[__name__] = NumPyMock()
