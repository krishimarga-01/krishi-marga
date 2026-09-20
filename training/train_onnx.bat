@echo off
setlocal enabledelayedexpansion
title Krishi Marga — Automated ONNX Model Training Pipeline
color 0A

echo ====================================================================
echo             KRISHI MARGA — ONNX MODEL TRAINING SUITE
echo ====================================================================
echo.

set DATASET_PATH=%~1

if "%DATASET_PATH%"=="" (
    echo Enter the folder path where you extracted the Kaggle dataset:
    echo Example: D:\Datasets\PlantDisease
    echo.
    set /p DATASET_PATH="Dataset Folder Path: "
)

if "%DATASET_PATH%"=="" (
    echo [ERROR] No dataset path provided. Exiting.
    pause
    exit /b 1
)

if not exist "%DATASET_PATH%" (
    echo [ERROR] The folder "%DATASET_PATH%" does not exist!
    echo Please verify the path and try again.
    pause
    exit /b 1
)

echo.
echo [1/5] Inspecting Dataset Structure...
python scripts\inspect_dataset.py --dataset "%DATASET_PATH%"
if %errorlevel% neq 0 (
    echo [ERROR] Dataset inspection failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] Preparing and Splitting Dataset (Train: 80%%, Val: 10%%, Test: 10%%)...
python scripts\prepare_dataset.py --dataset "%DATASET_PATH%"
if %errorlevel% neq 0 (
    echo [ERROR] Dataset preparation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [3/5] Commencing MobileNetV3-Small Training...
python scripts\train.py --arch mobilenet_v3_small --epochs 15 --batch-size 32
if %errorlevel% neq 0 (
    echo [ERROR] Training failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/5] Evaluating on Held-Out Test Set...
python scripts\evaluate.py
if %errorlevel% neq 0 (
    echo [ERROR] Evaluation failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [5/5] Exporting and Verifying ONNX Model...
python scripts\export_onnx.py
if %errorlevel% neq 0 (
    echo [ERROR] ONNX Export failed.
    pause
    exit /b %errorlevel%
)

echo.
echo ====================================================================
echo                    TRAINING PIPELINE COMPLETE!
echo ====================================================================
echo.
echo The final production files have been generated:
echo   1. models\onnx\krishi_marga_disease_model.onnx
echo   2. outputs\class_names.json
echo   3. outputs\model_metadata.json
echo   4. outputs\evaluation_report.json
echo.
echo Please send these 4 files back so they can be integrated into Krishi Marga!
echo ====================================================================
echo.
pause
