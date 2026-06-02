import sys
import os
# Forces the Vercel container to look inside the ai_model directory for local mock modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
