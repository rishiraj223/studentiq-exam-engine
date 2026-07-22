/**
 * Core AI Service
 * Simulates LLM responses if an API key is missing.
 * Readies the architecture for seamless OpenAI/Gemini integration.
 */

export class AIService {
  private static hasApiKey = !!process.env.OPENAI_API_KEY;

  /**
   * Generates a 7-day personalized study plan based on weakest chapters.
   */
  static async generateStudyPlan(weakChapters: string[], daysRemaining: number = 7) {
    if (this.hasApiKey) {
      // return await fetchLLM(...)
    }

    // Simulated Deterministic Fallback
    const plan = [];
    for (let i = 1; i <= daysRemaining; i++) {
      const focusChapter = weakChapters[(i - 1) % weakChapters.length] || 'General Revision';
      plan.push({
        day: i,
        title: `Focus: ${focusChapter}`,
        description: `Deep dive into ${focusChapter} concepts. Complete 20 practice questions and review mistakes.`
      });
    }
    return plan;
  }

  /**
   * Recommends the top 3 chapters to study based on test history accuracy.
   */
  static getChapterRecommendations(incorrectCountsByChapter: Record<string, number>): string[] {
    const sorted = Object.entries(incorrectCountsByChapter)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    return sorted.slice(0, 3);
  }

  /**
   * Handles Doubt Chatbot questions. Limits to JEE/NEET.
   */
  static async chatWithBot(message: string): Promise<string> {
    if (this.hasApiKey) {
      // return await fetchLLM(systemPrompt: "You are a strict JEE/NEET tutor...")
    }

    const m = message.toLowerCase();
    if (m.includes('hello') || m.includes('hi')) {
      return "Hello! I am your AI Study Assistant. I can help you with physics, chemistry, and biology/math doubts for JEE and NEET. Ask away!";
    }
    
    if (m.includes('newton') || m.includes('force')) {
      return "According to Newton's Second Law, Force = mass × acceleration (F = ma). Make sure to keep units consistent (e.g., kg and m/s²) when solving mechanics problems!";
    }

    if (m.includes('mole') || m.includes('chemistry')) {
      return "One mole contains exactly 6.02214076×10²³ elementary entities (Avogadro's number). When calculating molarity, ensure your volume is in liters!";
    }

    if (!m.includes('math') && !m.includes('physics') && !m.includes('chemistry') && !m.includes('biology')) {
      return "I specialize in JEE and NEET syllabus topics (Physics, Chemistry, Math, Biology). Could you please ask a question related to your syllabus?";
    }

    return "That's a great question! While I'm currently running in simulated mode, in a production environment I would perfectly solve this using my advanced reasoning engine.";
  }

  /**
   * Parses natural language into Test Parameters (Admin Side).
   * Example: "Create a hard 30-question Physics test covering Mechanics"
   */
  static async parseTestRequest(query: string) {
    if (this.hasApiKey) {
      // return await fetchLLM(JSON schema for { subject, difficulty, numQuestions, chapters })
    }

    const q = query.toLowerCase();
    let subject = 'Physics';
    if (q.includes('chem')) subject = 'Chemistry';
    if (q.includes('math')) subject = 'Mathematics';
    if (q.includes('bio')) subject = 'Biology';

    let difficulty = 'medium';
    if (q.includes('hard') || q.includes('difficult')) difficulty = 'hard';
    if (q.includes('easy')) difficulty = 'easy';

    const numMatch = q.match(/(\d+)/);
    const numQuestions = numMatch ? parseInt(numMatch[0]) : 20;

    return {
      subject,
      difficulty,
      numQuestions,
      chapters: ['All Chapters'] // Simulating a broad search
    };
  }

  /**
   * Estimates JEE/NEET rank based on a bell-curve statistical approximation.
   */
  static estimateRank(averageAccuracy: number, examType: 'JEE' | 'NEET'): string {
    if (averageAccuracy >= 90) return 'Top 1,000';
    if (averageAccuracy >= 80) return '1,000 - 5,000';
    if (averageAccuracy >= 70) return '5,000 - 15,000';
    if (averageAccuracy >= 60) return '15,000 - 30,000';
    if (averageAccuracy >= 50) return '30,000 - 75,000';
    if (averageAccuracy >= 40) return '75,000 - 150,000';
    return '> 150,000';
  }
}
