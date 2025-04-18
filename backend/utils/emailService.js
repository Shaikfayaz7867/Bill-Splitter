const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure email transporter
const createTransporter = () => {
  // Check for required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    // In development, we'll allow a fallback
    if (process.env.NODE_ENV !== 'production') {
      return null; // Return null if not in production and missing credentials
    }
    throw new Error('Email credentials not found in environment variables');
  }

  // Configure transporter based on email provider
  if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
    // Use custom SMTP server
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Default to Gmail
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Send settlement notification email
 * @param {Object} options - Email options
 * @returns {Object} - Result with success status and any error details
 */
const sendSettlementEmail = async ({ to, subject, groupName, fromPerson, toPerson, amount, isCompletionNotification = false }) => {
  try {
    console.log('sendSettlementEmail called with options:', { 
      to, 
      subject, 
      groupName, 
      fromPerson, 
      toPerson, 
      amount: parseFloat(amount), 
      isCompletionNotification 
    });
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('No email transporter created');
      if (process.env.NODE_ENV !== 'production') {
        console.log('In development mode - skipping actual email sending');
        // Return a fake success response in development when no email is configured
        return {
          success: true,
          messageId: 'dev-mode-no-email-sent',
          info: 'Email sending skipped in development mode'
        };
      } else {
        throw new Error('Failed to create email transporter in production mode');
      }
    }
    
    console.log('Email transporter created successfully');
    
    // Decide which template to use based on whether this is a completion notification
    let htmlContent;
    
    if (isCompletionNotification) {
      console.log('Using completion notification template');
      // Settlement completion notification template
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568;">Settlement Completed</h2>
          <p>Hello,</p>
          <p>A settlement in your group <strong>${groupName}</strong> has been marked as completed:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>${fromPerson}</strong> has paid <strong>${toPerson}</strong> the amount of <strong>$${parseFloat(amount).toFixed(2)}</strong>.</p>
          </div>
          
          <p>Thank you for using Bill Splitter!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #718096; font-size: 12px;">This is an automated message from Bill Splitter. Please do not reply to this email.</p>
        </div>
      `;
    } else {
      console.log('Using regular payment notification template');
      // Regular settlement notification template
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #4a5568;">Payment Due</h2>
          <p>Hello ${fromPerson},</p>
          <p>According to the expenses in <strong>${groupName}</strong>, you need to pay:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount:</strong> $${parseFloat(amount).toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${toPerson}</p>
          </div>
          
          <p>Please make this payment at your earliest convenience and mark it as complete in the app.</p>
          <p>Thank you for using Bill Splitter!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #718096; font-size: 12px;">This is an automated message from Bill Splitter. Please do not reply to this email.</p>
        </div>
      `;
    }
    
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Bill Splitter'} <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    };
    
    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });
    
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', {
        messageId: info.messageId,
        response: info.response
      });
      
      return {
        success: true,
        messageId: info.messageId,
        info
      };
    } catch (sendError) {
      console.error('Error in transporter.sendMail:', sendError);
      throw sendError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error('Error sending settlement email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send balance summary email
 * @param {Object} options - Email options
 * @returns {Object} - Result with success status and any error details
 */
const sendBalanceSummaryEmail = async (options) => {
  try {
    // Validate required options
    if (!options.to || !options.userName || !options.groupName || !options.balances) {
      console.error('Missing required email options:', options);
      return { 
        success: false, 
        error: 'Missing required email parameters' 
      };
    }

    // Create email transport
    const transporter = await createTransporter();
    
    // Generate balance rows HTML
    const balanceRowsHtml = options.balances.map(balance => {
      const amount = parseFloat(balance.amount).toFixed(2);
      const color = balance.amount >= 0 ? 'green' : 'red';
      const status = balance.amount >= 0 ? 'to receive' : 'to pay';
      
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${balance.withPerson}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; color: ${color};">$${Math.abs(amount)} ${status}</td>
        </tr>
      `;
    }).join('');
    
    // Email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #4a5568;">Bill Splitter - Balance Summary</h2>
        <p>Hello ${options.userName},</p>
        <p>Here is your current balance summary for the group <strong>${options.groupName}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Person</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${balanceRowsHtml}
          </tbody>
        </table>
        
        <p>Thank you for using Bill Splitter!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #718096; font-size: 12px;">This is an automated message from Bill Splitter. Please do not reply to this email.</p>
      </div>
    `;
    
    // Email options
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || 'Bill Splitter'} <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject || `Balance Summary for ${options.groupName}`,
      html: htmlContent,
      text: `Hello ${options.userName}, Here is your current balance summary for the group ${options.groupName}. ${options.balances.map(b => `${b.withPerson}: $${parseFloat(b.amount).toFixed(2)}`).join(', ')}. Thank you for using Bill Splitter!`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Balance summary email sent successfully:', info.messageId);
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    console.error('Error sending balance summary email:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Test the email functionality
 * @returns {Promise<Object>} Test results
 */
const testEmail = async () => {
  try {
    console.log('Testing email functionality...');
    
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not found in environment variables.');
      return {
        success: false,
        error: 'Missing email credentials. Check EMAIL_USER and EMAIL_PASS in .env file.'
      };
    }
    
    // Get test email recipient
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    console.log(`Sending test email to: ${testEmail}`);
    
    // Try to create a transporter to validate configuration
    const transporter = await createTransporter();
    console.log('Email transporter created successfully');
    
    // Verify SMTP connection and credentials
    console.log('Verifying SMTP connection...');
    try {
      const verification = await transporter.verify();
      console.log('SMTP Verification result:', verification);
    } catch (smtpError) {
      console.error('SMTP Verification failed:', smtpError);
      return {
        success: false,
        error: `SMTP verification failed: ${smtpError.message}`,
        smtpError: {
          code: smtpError.code,
          command: smtpError.command,
          response: smtpError.response,
          responseCode: smtpError.responseCode,
          message: smtpError.message
        }
      };
    }
    
    // Send a test email
    const result = await sendSettlementEmail({
      to: testEmail,
      fromPerson: 'John',
      toPerson: 'Jane',
      amount: 125.50,
      groupName: 'Trip to Paris'
    });
    
    console.log('Test email result:', result);
    return {
      ...result,
      configuration: {
        emailUser: process.env.EMAIL_USER ? 'configured' : 'missing',
        emailPass: process.env.EMAIL_PASS ? `configured (${process.env.EMAIL_PASS.length} chars)` : 'missing',
        testEmail: testEmail,
        useCustomSMTP: !!(process.env.EMAIL_HOST && process.env.EMAIL_PORT),
        smtpHost: process.env.EMAIL_HOST || 'gmail',
        smtpPort: process.env.EMAIL_PORT
      }
    };
  } catch (error) {
    console.error('Test email failed:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack
    };
  }
};

module.exports = {
  sendSettlementEmail,
  sendBalanceSummaryEmail,
  testEmail,
  createTransporter // Exported for testing purposes
}; 