
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from 'lucide-react';

interface TestimonialProps {
  quote: string;
  author: string;
  position: string;
  company: string;
  avatarSrc?: string;
  delay: string;
}

const TestimonialCard = ({ quote, author, position, company, avatarSrc, delay }: TestimonialProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const initials = author
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${delay} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <Card className="h-full glass hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start mb-4">
            <Quote className="text-primary h-6 w-6 mr-2 mt-1 flex-shrink-0" />
            <p className="text-lg italic">{quote}</p>
          </div>
          <div className="flex items-center mt-6">
            <Avatar className="h-12 w-12 mr-4">
              {avatarSrc ? (
                <AvatarImage src={avatarSrc} alt={author} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{author}</p>
              <p className="text-sm text-muted-foreground">
                {position}, {company}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      quote: "DealPulse Alert transformed our pricing strategy. We used to manually check competitor prices daily, but now we get instant alerts and can react immediately. Our sales are up 18% since we started.",
      author: "Sarah Johnson",
      position: "Sales Manager",
      company: "Riverside Motors",
      delay: "delay-100"
    },
    {
      quote: "The real-time alerts have given us a competitive edge we never had before. We're saving 15+ hours per week on manual checks and making data-driven decisions that have boosted our margins.",
      author: "Michael Chen",
      position: "Owner",
      company: "Premier Auto Group",
      delay: "delay-200"
    },
    {
      quote: "I was skeptical at first, but DealPulse Alert paid for itself in the first month. We caught a competitor's flash sale within minutes and matched it, saving us from losing multiple sales that day.",
      author: "James Wilson",
      position: "Marketing Director",
      company: "Liberty Dealerships",
      delay: "delay-300"
    },
  ];

  return (
    <div className="py-20 relative" id="testimonials">
      {/* Background effect */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <div
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What our customers say</h2>
          <p className="text-muted-foreground text-lg">
            Discover how DealPulse Alert is helping businesses stay competitive and grow their bottom line.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              position={testimonial.position}
              company={testimonial.company}
              delay={testimonial.delay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
