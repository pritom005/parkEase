"""
Vercel Python serverless entry point for ParkEase API routes (/api/*).
Adds python/ to the import path and exposes the Flask app object.
"""

import os
import sys

# Resolve project root and python backend directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
PYTHON_DIR = os.path.join(ROOT_DIR, "python")

if PYTHON_DIR not in sys.path:
    sys.path.insert(0, PYTHON_DIR)

from app import app
