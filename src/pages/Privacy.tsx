
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Privacy Policy"
        description="Read about how Carparison collects, uses, and protects your data. Our privacy policy outlines our commitment to your data security."
        canonicalUrl="https://carparison.app/privacy"
      />
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead mb-6">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2>1. Introduction</h2>
              <p>DealPulse ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.</p>
              
              <h2>2. Information We Collect</h2>
              <p>We may collect information that you provide directly to us, such as when you create an account, subscribe to our service, or contact us.</p>
              <p>This may include:</p>
              <ul>
                <li>Contact information (name, email address, phone number)</li>
                <li>Billing information (credit card details, billing address)</li>
                <li>Account credentials</li>
                <li>URLs you wish to monitor</li>
                <li>Preferences and settings</li>
              </ul>
              
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide, maintain, and improve our service</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Monitor and analyze trends, usage, and activities</li>
              </ul>
              
              <h2>4. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.</p>
              
              <h2>5. Data Retention</h2>
              <p>We will retain your information for as long as your account is active or as needed to provide you with our services. We will also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.</p>
              
              <h2>6. Your Rights</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, delete, or restrict processing of your personal information.</p>
              
              <h2>7. Cookies and Tracking Technologies</h2>
              <p>We use cookies and similar tracking technologies to track the activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
              
              <h2>8. Third-Party Services</h2>
              <p>Our service may contain links to third-party websites or services that are not owned or controlled by DealPulse. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.</p>
              
              <h2>9. Changes to This Privacy Policy</h2>
              <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
              
              <h2>10. Contact Us</h2>
              <p>If you have any questions about this Privacy Policy, please contact us via our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Privacy;
