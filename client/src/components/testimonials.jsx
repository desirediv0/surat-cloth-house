import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState } from "react";

export default function TestimonialsSection() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const testimonials = [
    {
      name: "Ravi Sharma",
      role: "Fitness Enthusiast",
      avatar: "RS",
      quote:
        "I've tried many supplements, but GenuineNutrition products have truly made a difference in my training and recovery.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Yoga Instructor",
      avatar: "PP",
      quote:
        "The quality of these supplements is exceptional. I recommend them to all my clients looking for clean nutrition.",
      rating: 5,
    },
    {
      name: "Arjun Singh",
      role: "Bodybuilder",
      avatar: "AS",
      quote:
        "These supplements have been a game-changer for my competition prep. Pure ingredients and great results!",
      rating: 5,
    },
  ];

  // Variants for animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  return (
    <section className="py-20 bg-[#1C4E80] text-white relative overflow-hidden">
      {/* Abstract background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white opacity-5"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white opacity-5"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 uppercase tracking-wider">
            <span className="relative inline-block">
              CUSTOMER TESTIMONIALS
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-[#F47C20]"
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 0.8 }}
                viewport={{ once: true }}
              ></motion.span>
            </span>
          </h2>
          <p className="text-gray-200 max-w-2xl mx-auto text-lg">
            Real experiences from people who have transformed their fitness
            journey with our premium supplements
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative"
            >
              <motion.div
                className={`bg-white p-8 rounded-lg border border-gray-200 h-full relative z-10 transition-all duration-300`}
                animate={{
                  scale: hoveredIndex === index ? 1.03 : 1,
                  boxShadow:
                    hoveredIndex === index
                      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                      : "0 0 0 rgba(0, 0, 0, 0)",
                }}
              >
                <div className="absolute -top-3 -left-3">
                  <Quote className="w-8 h-8 text-[#1C4E80]" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#1C4E80] text-white flex items-center justify-center text-xl font-bold ring-2 ring-[#1C4E80] ring-offset-2 ring-offset-white">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[#333333]">
                      {testimonial.name}
                    </h3>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex text-[#F47C20] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={`${
                        i < testimonial.rating
                          ? "fill-[#F47C20]"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <p className="text-[#333333] text-lg mb-4">
                  &quot;{testimonial.quote}&quot;
                </p>

                <motion.div
                  className="w-12 h-1 bg-[#F47C20]"
                  initial={{ width: 0 }}
                  animate={{ width: hoveredIndex === index ? 48 : 24 }}
                  transition={{ duration: 0.3 }}
                ></motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <button className="px-8 py-3 bg-[#F47C20] text-white font-bold uppercase tracking-wider hover:bg-[#1C4E80] transition-colors rounded">
            View All Reviews
          </button>
        </motion.div>
      </div>
    </section>
  );
}
