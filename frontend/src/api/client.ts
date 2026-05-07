import axios from 'axios';
import type { StatsResponse, DelayRecord, UploadRecord, CodeStat, MonthStat, AlertRecord } from '../types';

const BASE = import.meta.env.VITE_API_URL ?? '';
const api  = axios.create({ baseURL: `${BASE}/api` });


export const uploadFile = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload', form);
  return data as { uploadId: string; recordCount: number; flightCount: number };
};

export const getUploads  = async (): Promise<UploadRecord[]> => (await api.get('/upload')).data;
export const deleteUpload = async (id: string) => api.delete(`/upload/${id}`);

export const getDelays = async (params: Record<string, string>): Promise<{ total: number; data: DelayRecord[] }> =>
  (await api.get('/delays', { params })).data;

export const getStats = async (params: Record<string, string> = {}): Promise<StatsResponse> =>
  (await api.get('/delays/stats', { params })).data;

export const getOrigins = async (uploadId?: string): Promise<string[]> =>
  (await api.get('/delays/origins', { params: uploadId ? { uploadId } : {} })).data;

export const generateTrendAnalysis = async (trends: MonthStat[], topCodes: CodeStat[], uploadId?: string): Promise<string> =>
  (await api.post('/summaries/trend', { trends, topCodes, uploadId })).data.content;

export const generateCodeAnalysis = async (code: string, stat: CodeStat, uploadId?: string): Promise<string> =>
  (await api.post('/summaries/code', { code, stat, uploadId })).data.content;

export const generateAnomalySummary = async (anomalies: unknown[]): Promise<string> =>
  (await api.post('/summaries/anomaly', { anomalies })).data.content;

export const sendAlert = async (payload: { team: string; message: string; codes: string[] }) =>
  (await api.post('/alerts', payload)).data;

export const getMonths = async (uploadId?: string): Promise<string[]> =>
  (await api.get('/delays/months', { params: uploadId ? { uploadId } : {} })).data;

export const getAlerts = async (): Promise<AlertRecord[]> =>
  (await api.get('/alerts')).data;
