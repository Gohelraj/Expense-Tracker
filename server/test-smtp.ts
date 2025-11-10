import { smtpService } from './smtp-service';
import 'dotenv/config';

async function testSMTP() {
    console.log('Testing SMTP configuration...\n');

    // Initialize SMTP service
    const initialized = await smtpService.initialize();

    if (!initialized) {
        console.error('❌ SMTP service failed to initialize');
        console.error('Please check your SMTP environment variables in .env file');
        process.exit(1);
    }

    console.log('✅ SMTP service initialized successfully\n');

    // Get test email from command line argument
    const testEmail = process.argv[2];

    if (!testEmail) {
        console.log('To send a test email, run:');
        console.log('  npx tsx server/test-smtp.ts your-email@example.com\n');
        process.exit(0);
    }

    console.log(`Sending test email to: ${testEmail}\n`);

    // Send test email
    const sent = await smtpService.sendEmail({
        to: testEmail,
        subject: 'Test Email from Expense Tracker',
        text: 'This is a test email to verify SMTP configuration.',
        html: `
            <h2>Test Email</h2>
            <p>This is a test email to verify your SMTP configuration is working correctly.</p>
            <p>If you received this email, your SMTP setup is successful! ✅</p>
        `,
    });

    if (sent) {
        console.log('✅ Test email sent successfully!');
        console.log('Check your inbox (and spam folder) for the test email.\n');
    } else {
        console.error('❌ Failed to send test email');
        console.error('Check the error messages above for details.\n');
        process.exit(1);
    }
}

testSMTP().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
