export interface Point {
  x: number;
  y: number;
}

export interface DatasetPreset {
  id: string;
  name: string;
  xLabel: string;
  yLabel: string;
  points: Point[];
}

export interface LossPoint {
  epoch: number;
  mse: number;
}

export interface PredictionRow {
  x: number;
  actual: number;
  predicted: number;
}

export interface RegressionRun {
  id: number;
  datasetName: string;
  method: string;
  slope: number;
  intercept: number;
  mse: number;
  r2: number;
  pointCount: number;
  createdAt: string;
}

export interface RegressionResponse {
  method: string;
  slope: number;
  intercept: number;
  mse: number;
  rmse: number;
  r2: number;
  epochs: number;
  learningRate: number;
  lossHistory: LossPoint[];
  predictions: PredictionRow[];
  equation: string;
  recentRuns?: RegressionRun[];
}

export interface CodeSnippet {
  id: string;
  title: string;
  code: string;
}

export interface PythonSourceFile {
  filename: string;
  name: string;
  lines: number;
  code: string;
}

export interface PortfolioPayload {
  profile: {
    name: string;
    headline: string;
    role: string;
    institution: string;
    year: string;
    email: string;
    avatarUrl: string;
    resumePdfUrl: string;
    resumePreviewUrl: string;
    about: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    status: string;
    focus: string[];
  }>;
  projects: Array<{
    id: string;
    title: string;
    category: string;
    summary: string;
    details: string[];
    stack: string[];
    interactive: boolean;
  }>;
  skills: Array<{
    name: string;
    group: string;
    context: string;
  }>;
  spokenLanguages: Array<{
    name: string;
    proficiency: string;
  }>;
  architecture: {
    runtime: string;
    storage: string;
    mlEngine: string;
    apiServer: string;
  };
  pythonVersion: string;
  stats: {
    totalInquiries: number;
  };
  recentRuns: RegressionRun[];
  presets: DatasetPreset[];
  snippets: CodeSnippet[];
}
