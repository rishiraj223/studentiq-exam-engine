import { createAdminClient } from '@/lib/supabase/admin';

export class NotificationService {
  /**
   * Generates and sends an automatic test report (simulated via console.log).
   * This handles fetching the provisional rank and formatting the SMS/WhatsApp payload.
   */
  static async sendTestReport(studentId: string, testId: string, studentName: string, attemptData: any) {
    try {
      const admin = createAdminClient();

      // 1. Fetch the test template name
      const { data: testTemplate } = await admin
        .from('mock_test_templates')
        .select('name, total_marks')
        .eq('id', testId)
        .single();
      
      const testName = testTemplate?.name || 'Recent Test';
      const maxMarks = testTemplate?.total_marks || 0;

      // 2. Calculate Provisional Rank
      // Get all attempts for this test to find rank
      const { data: allAttempts } = await admin
        .from('test_attempts')
        .select('student_id, total_score')
        .eq('test_template_id', testId)
        .order('total_score', { ascending: false });

      let rank = 'N/A';
      let totalParticipants = allAttempts?.length || 1;
      
      if (allAttempts) {
        const studentIndex = allAttempts.findIndex(a => a.student_id === studentId);
        if (studentIndex !== -1) {
          rank = `${studentIndex + 1}`;
        } else {
          // If the attempt wasn't returned in the query yet (race condition), calculate manually
          const betterScores = allAttempts.filter(a => a.total_score > attemptData.totalScore).length;
          rank = `${betterScores + 1}`;
          totalParticipants += 1;
        }
      }

      // 3. Format Message
      const accuracy = (attemptData.correctCount + attemptData.incorrectCount > 0)
        ? Math.round((attemptData.correctCount / (attemptData.correctCount + attemptData.incorrectCount)) * 100)
        : 0;

      const message = `
========================================
[AUTO-REPORT: WhatsApp / SMS]
To: Parent of ${studentName}

Hello! ${studentName} has just completed a test on StudentIQ.

📊 TEST: ${testName}
🎯 SCORE: ${attemptData.totalScore} / ${maxMarks}
📈 ACCURACY: ${accuracy}%
🏆 PROVISIONAL RANK: ${rank} out of ${totalParticipants}

✅ Correct: ${attemptData.correctCount} | ❌ Incorrect: ${attemptData.incorrectCount}

View the full detailed breakdown anytime on your Parent Portal!
Link: https://studentiq.app/parent/login
========================================
`;

      // Simulate sending
      console.log(message);
      
    } catch (error) {
      console.error('NotificationService Error:', error);
      // Fail silently to not disrupt the student's submission flow
    }
  }

  /**
   * Generates a monthly summary report (Mock trigger)
   */
  static async sendMonthlyReport(studentName: string, avgScore: number, testsTaken: number) {
    const message = `
========================================
[MONTHLY DIGEST: WhatsApp / SMS]
To: Parent of ${studentName}

📅 Monthly Progress Report is ready!
${studentName} took ${testsTaken} tests this month.
Overall Average Score: ${avgScore}

Keep up the great work! Check the Parent Portal for trend charts.
========================================
`;
    console.log(message);
  }
}
