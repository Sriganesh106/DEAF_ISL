# 🤟 Silent Learn - AI-Powered ISL Learning Platform

A production-ready web platform for Deaf students in India, utilizing **Machine Learning (TensorFlow/MediaPipe)** for real-time **Indian Sign Language (ISL)** detection and **AR (Augmented Reality)** for interactive experiences. Built with **Next.js**, **Tailwind CSS**, and **TypeScript**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.12+-orange.svg)

## 🌟 Features

### 📚 Learning Platform
- **Visual-First Design** - All content is designed for visual learners
- **Large Buttons & Icons** - Easy to use for all ages
- **Text + Icon Guidance** - Clear navigation for everyone
- **Progress Tracking** - See your learning journey

### ✋ ISL Sign Language Detection
- **Real-time Detection** - Show your hand to camera and get instant feedback
- **26 Alphabet Letters** - Complete ISL alphabet recognition
- **Practice Modes** - Free practice, guided lessons, and quiz mode
- **Tips & Descriptions** - Learn how to make each sign correctly

### 🌍 AR Learning Experiences
- **Solar System AR** - Explore planets in 3D
- **Interactive Models** - Rotate, zoom, and click for info
- **QR Code Access** - Scan to open AR lessons
- **Educational Content** - Learn facts about each object

### 🎯 Quiz System
- **Multiple Choice Questions** - Test your knowledge
- **Instant Feedback** - See correct answers immediately
- **Score Tracking** - Earn points and achievements
- **Progress Saving** - Continue where you left off

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun
- Python 3.10+ (for ML backend)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/silent-learn.git
cd silent-learn

# Install frontend dependencies
bun install

# Set up database
bun run db:push

# Start the development server
bun run dev
```

The app will be available at `http://localhost:3000`

### ML Backend Setup (Optional)

For real sign language detection, set up the Python backend:

```bash
# Navigate to ML backend
cd ml-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
python app.py
```

The ML API will run at `http://localhost:8000`

## 📁 Project Structure

```
silent-learn/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Main landing page & dashboard
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── api/               # API routes
│   │       ├── ar-lessons/    # AR lessons endpoint
│   │       ├── qr-generate/   # QR code generation
│   │       ├── predict-sign/  # Sign detection API
│   │       ├── lessons/       # Lessons management
│   │       ├── quiz/          # Quiz system
│   │       └── progress/      # Progress tracking
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── ar/
│   │   │   └── SolarSystemAR.tsx  # 3D Solar System
│   │   ├── sign/
│   │   │   └── SignDetection.tsx  # Sign language detection
│   │   └── quiz/
│   │       └── QuizSystem.tsx     # Quiz component
│   │
│   └── lib/
│       ├── db.ts              # Prisma database client
│       └── utils.ts           # Utility functions
│
├── ml-backend/                 # Python ML Backend
│   ├── app.py                 # FastAPI application
│   ├── requirements.txt       # Python dependencies
│   ├── utils/
│   │   ├── hand_detector.py   # MediaPipe hand detection
│   │   ├── feature_extractor.py  # Feature extraction
│   │   ├── model.py           # Neural network model
│   │   └── trainer.py         # Training pipeline
│   └── data/
│       └── prepare_dataset.py # Dataset preparation
│
├── prisma/
│   └── schema.prisma          # Database schema
│
├── public/
│   └── ar/                    # AR assets
│
└── package.json
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful UI components
- **Three.js** - 3D graphics for AR
- **Framer Motion** - Smooth animations
- **React Webcam** - Camera access

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Database ORM
- **SQLite** - Database (can be changed to PostgreSQL/MongoDB)

### ML/AI
- **Python** - ML backend language
- **FastAPI** - Python web framework
- **TensorFlow** - Deep learning
- **MediaPipe** - Hand landmark detection
- **OpenCV** - Image processing
- **NumPy** - Numerical computing

## 📖 API Documentation

### Sign Detection API

**POST** `/api/predict-sign`

Predict ISL letter from image

```json
// Request
{
  "image": "base64_encoded_image",
  "useML": true
}

// Response
{
  "success": true,
  "predictedLetter": "A",
  "confidence": 0.92,
  "description": "Make a fist with thumb on the side",
  "tips": "Keep fingers tight together"
}
```

### QR Code Generation API

**GET** `/api/qr-generate?code=SOLAR-001`

Generate QR code for AR lesson

```json
// Response
{
  "success": true,
  "code": "SOLAR-001",
  "lesson": "Solar System AR",
  "qrCode": "data:image/png;base64,..."
}
```

### Lessons API

**GET** `/api/lessons`

Get all available lessons

**GET** `/api/lessons?id=lesson-001`

Get specific lesson

### Progress API

**GET** `/api/progress`

Get user progress

**POST** `/api/progress`

Update progress

```json
{
  "lessonId": "lesson-001",
  "action": "complete",
  "progress": 100
}
```

### Quiz API

**GET** `/api/quiz?lessonId=lesson-001`

Get quiz questions

**POST** `/api/quiz`

Submit quiz answers

## 🎮 Usage

### Learning Sign Language

1. Go to Dashboard → Sign Language tab
2. Click "Start Camera"
3. Show your hand to the camera
4. The system will detect and show the letter
5. Use Quiz mode to test your skills

### AR Learning

1. Go to Dashboard → AR Learning tab
2. Click on any AR experience
3. Scan the QR code with your phone
4. Point at a flat surface
5. Explore 3D models and learn!

### Taking Quizzes

1. Open any lesson with a quiz
2. Answer multiple choice questions
3. See your results and correct answers
4. Retake to improve your score

## 🧪 Training Custom Model

### Prepare Your Dataset

```bash
cd ml-backend
python -m data.prepare_dataset --source /path/to/your/images --output data/custom_dataset
```

### Train the Model

```bash
python -m utils.trainer --data data/custom_dataset --epochs 50 --batch-size 32
```

The model will be saved to `models/isl_model.h5`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# ML Backend (optional)
ML_BACKEND_URL="http://localhost:8000"

# App URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### ML Backend (Docker)

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
```

```bash
docker build -t silent-learn-ml .
docker run -p 8000:8000 silent-learn-ml
```

---

Made with ❤️ for Deaf Students in India

**Silent Learn** - Learning Without Sound Barriers 🤟
