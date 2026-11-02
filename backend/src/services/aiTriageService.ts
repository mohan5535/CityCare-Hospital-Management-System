import { config } from '../config/env';
import { Department } from '../models/Department';

export interface SymptomEvaluationResult {
  isEmergency: boolean;
  emergencyReason?: string;
  recommendedDepartmentSlugs: string[];
  explanation: string;
  recommendedDepartments: Array<{
    name: string;
    slug: string;
    description: string;
    icon: string;
  }>;
  disclaimer: string;
}

const EMERGENCY_PATTERNS = [
  /chest\s*pain/i,
  /heart\s*attack/i,
  /shortness\s*of\s*breath/i,
  /difficulty\s*breathing/i,
  /severe\s*bleeding/i,
  /unconscious/i,
  /fainted/i,
  /stroke/i,
  /paralysis/i,
  /slurred\s*speech/i,
  /coughing\s*blood/i,
  /anaphylaxis/i,
  /sudden\s*numbness/i,
  /severe\s*head\s*trauma/i,
];

const CLINICAL_RULE_MAP: Array<{
  slug: string;
  name: string;
  patterns: RegExp[];
  reason: string;
}> = [
  {
    slug: 'cardiology',
    name: 'Cardiology',
    patterns: [/chest/i, /heart/i, /palpitation/i, /angina/i, /pulse/i, /high blood pressure/i, /hypertension/i],
    reason: 'Symptoms relate to cardiovascular system and blood circulation.',
  },
  {
    slug: 'neurology',
    name: 'Neurology',
    patterns: [/headache/i, /migraine/i, /seizure/i, /dizzy/i, /vertigo/i, /memory/i, /numbness/i, /tremor/i],
    reason: 'Symptoms involve the central nervous system, brain, or nerves.',
  },
  {
    slug: 'orthopedics',
    name: 'Orthopedics',
    patterns: [/bone/i, /joint/i, /fracture/i, /knee/i, /back\s*pain/i, /spine/i, /arthritis/i, /shoulder/i, /sprain/i],
    reason: 'Symptoms affect the musculoskeletal system, bones, or joints.',
  },
  {
    slug: 'pediatrics',
    name: 'Pediatrics',
    patterns: [/child/i, /baby/i, /infant/i, /toddler/i, /vaccination/i],
    reason: 'Specialized healthcare for infants, children, and adolescents.',
  },
  {
    slug: 'dermatology',
    name: 'Dermatology',
    patterns: [/skin/i, /rash/i, /acne/i, /itch/i, /eczema/i, /mole/i, /hair\s*loss/i, /psoriasis/i],
    reason: 'Concerns regarding skin conditions, rashes, or hair/scalp.',
  },
  {
    slug: 'ent',
    name: 'ENT (Ear, Nose & Throat)',
    patterns: [/ear/i, /hearing/i, /throat/i, /tonsil/i, /sinus/i, /nasal/i, /hoarse/i],
    reason: 'Symptoms relate to ear, nose, throat, or sinus passages.',
  },
  {
    slug: 'ophthalmology',
    name: 'Ophthalmology',
    patterns: [/eye/i, /vision/i, /blurred/i, /cataract/i, /glaucoma/i, /cornea/i],
    reason: 'Vision and ocular health assessment.',
  },
  {
    slug: 'gastroenterology',
    name: 'Gastroenterology',
    patterns: [/stomach/i, /digest/i, /abdominal/i, /acid/i, /liver/i, /nausea/i, /vomit/i, /diarrhea/i, /constipat/i],
    reason: 'Symptoms affect the digestive tract, stomach, or liver.',
  },
];

export const evaluateSymptoms = async (
  symptomText: string
): Promise<SymptomEvaluationResult> => {
  const sanitized = symptomText.trim().substring(0, 500);

  // 1. Critical Emergency Detection
  const emergencyMatch = EMERGENCY_PATTERNS.find((regex) => regex.test(sanitized));
  const isEmergency = !!emergencyMatch;
  const emergencyReason = isEmergency
    ? 'Potential critical or life-threatening symptoms detected. Immediate emergency medical intervention is required.'
    : undefined;

  let recommendedSlugs: string[] = [];
  let explanation = '';

  // 2. Try Gemini API if key is present
  if (config.GEMINI_API_KEY && config.GEMINI_API_KEY !== 'your_gemini_api_key_optional') {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a clinical hospital triage assistant. Given user symptoms: "${sanitized}", return a JSON object with:
                    "departmentSlugs": array of 1 to 3 matching departments from [general-medicine, cardiology, neurology, orthopedics, pediatrics, dermatology, ent, ophthalmology, gastroenterology],
                    "explanation": concise 2-sentence rationale for evaluation.
                    Do not diagnose diseases or prescribe medication. Respond ONLY in valid JSON.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data: any = await response.json();
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textContent) {
          const cleanJson = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed.departmentSlugs) && parsed.departmentSlugs.length > 0) {
            recommendedSlugs = parsed.departmentSlugs;
            explanation = parsed.explanation || '';
          }
        }
      }
    } catch (err) {
      console.warn('[AI Triage] Gemini API call fallback to clinical rules:', err);
    }
  }

  // 3. Fallback: Clinical Keyword Rule Matcher
  if (recommendedSlugs.length === 0) {
    for (const rule of CLINICAL_RULE_MAP) {
      if (rule.patterns.some((p) => p.test(sanitized))) {
        recommendedSlugs.push(rule.slug);
        if (!explanation) {
          explanation = rule.reason;
        }
      }
    }

    if (recommendedSlugs.length === 0) {
      recommendedSlugs = ['general-medicine'];
      explanation = 'For non-specific or systemic symptoms, an evaluation by General Medicine is recommended.';
    }
  }

  // 4. Fetch department details
  const matchedDepts = await Department.find({
    slug: { $in: recommendedSlugs },
  });

  const formattedDepts = matchedDepts.map((d) => ({
    name: d.name,
    slug: d.slug,
    description: d.description,
    icon: d.icon || 'HeartPulse',
  }));

  return {
    isEmergency,
    emergencyReason,
    recommendedDepartmentSlugs: recommendedSlugs,
    explanation,
    recommendedDepartments: formattedDepts,
    disclaimer:
      'This guidance is provided for informational and department routing purposes only. It does not constitute a medical diagnosis or treatment plan. In case of an emergency, call 112 / 108 or visit the nearest emergency department immediately.',
  };
};
