import { Request, Response } from 'express';
import { evaluateSymptoms } from '../services/aiTriageService';
import { sendSuccess, sendError } from '../utils/response';

export const triageSymptoms = async (req: Request, res: Response): Promise<any> => {
  try {
    const { symptoms } = req.body;
    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return sendError(res, 'Please provide a description of your symptoms', 400);
    }

    if (symptoms.length > 500) {
      return sendError(res, 'Symptom description exceeds 500 characters limit', 400);
    }

    const evaluation = await evaluateSymptoms(symptoms);
    return sendSuccess(res, evaluation, 'Symptoms evaluated successfully');
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to evaluate symptoms', 500);
  }
};

