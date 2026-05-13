import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { TaskCard } from "@/components/TaskCard";
import { RewardCard } from "@/components/RewardCard";
import { ChildAvatar } from "@/components/ChildAvatar";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Sparkle, 
  Star, 
  Stars, 
  Wand2, 
  Zap,
  ArrowRight,
} from "lucide-react";

// Demo data for showcasing
const demoTasks = [
  { id: "1", name: "Make your bed", icon: "bed", points: 10, status: "pending" as const, category: "cleaning", difficulty: "beginner" as const },
  { id: "2", name: "Feed the dog", icon: "dog", points: 15, status: "completed" as const, category: "pet_care", difficulty: "beginner" as const },
];

const demoRewards = [
  { id: "1", name: "30 min Screen Time", icon: "monitor", pointsCost: 50, category: "screen_time" },
  { id: "2", name: "Ice Cream Trip", icon: "iceCream", pointsCost: 100, category: "treats" },
];

const features = [
  {
    icon: Sparkles,
    title: "Task Management",
    description: "Create and assign age-appropriate chores with point values",
  },
  {
    icon: Star,
    title: "Rewards Marketplace",
    description: "Kids redeem points for screen time, treats, or allowance",
  },
  {
    icon: Wand2,
    title: "Gamification",
    description: "Levels, badges, and achievements keep kids motivated",
  },
  {
    icon: Stars,
    title: "Family Friendly",
    description: "Separate parent and child dashboards for easy use",
  },
  {
    icon: Sparkle,
    title: "Photo Verification",
    description: "Kids submit photos as proof of completed tasks",
  },
  {
    icon: Zap,
    title: "Works Everywhere",
    description: "Responsive design for phones, tablets, and desktops",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="landing" />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-hero-gradient opacity-5" />
        
        {/* Floating decorations */}
        <motion.div
          className="absolute left-10 top-32 text-6xl opacity-20"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute right-20 top-48 text-5xl opacity-20"
          animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
        >
          🏆
        </motion.div>
        <motion.div
          className="absolute left-1/4 bottom-20 text-4xl opacity-20"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        >
          ⭐
        </motion.div>

        <div className="container relative px-4 py-20 md:py-32">
          <motion.div
            className="mx-auto max-w-4xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={16} />
              Make chores fun for the whole family
            </motion.div>

            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Turn household tasks into{" "}
              <span className="text-gradient-hero">epic adventures</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              NoMiRo helps families manage chores, reward responsibility, and teach 
              kids the value of contributing to the household—all through fun gamification.
            </p>

            <motion.div
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl" className="gap-2">
                  Start Your Quest
                  <ArrowRight size={20} />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="xl">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Avatar showcase */}
            <motion.div
              className="mt-16 flex items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              {[1, 2, 3, 4, 5].map((index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ChildAvatar avatarIndex={index} size="lg" />
                </motion.div>
              ))}
            </motion.div>
            <p className="mt-4 text-sm text-muted-foreground">
              10 colorful avatars for kids to choose from
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container px-4">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Everything your family needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete platform for managing chores, rewards, and family responsibility
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="rounded-2xl bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20">
        <div className="container px-4">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              See it in action
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Beautiful cards for tasks and rewards that kids love
            </p>
          </motion.div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {/* Tasks Preview */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
                📋 Task Cards
              </h3>
              <div className="space-y-4">
                {demoTasks.map((task) => (
                  <TaskCard key={task.id} {...task} />
                ))}
              </div>
            </motion.div>

            {/* Rewards Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="mb-6 font-display text-xl font-semibold text-foreground">
                🎁 Reward Cards
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {demoRewards.map((reward) => (
                  <RewardCard key={reward.id} {...reward} currentPoints={75} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-hero-gradient py-20">
        <div className="container px-4">
          <motion.div
            className="mx-auto max-w-2xl text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to start your family's quest?
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join thousands of families making chores fun and rewarding
            </p>
            <Link to="/auth?mode=signup" className="mt-8 inline-block">
              <Button variant="heroOutline" size="xl" className="gap-2">
                <Star size={20} />
                Create Free Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 NoMiRo. Making household tasks fun for families everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
