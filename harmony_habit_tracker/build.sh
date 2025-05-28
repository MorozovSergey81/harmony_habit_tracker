#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Current directory:"
pwd
echo "Directory contents:"
ls -la

echo "Python version:"
python --version

echo "Upgrading pip..."
python -m pip install --upgrade pip

echo "Installing requirements..."
pip install -r requirements.txt

echo "Installed packages:"
pip list
