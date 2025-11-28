'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface BentoGridItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  span?: number;
  access?: 'Free' | 'Paid';
}

const BentoGridItem = ({
  title,
  description,
  icon,
  className,
  span = 2,
  access,
}: BentoGridItemProps) => {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, damping: 25 },
    },
  };

  return (
    <motion.div
      variants={variants}
      className={cn(
        'group border-primary/10 bg-card hover:border-primary/30 relative flex h-full cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border px-6 pt-6 pb-10 shadow-md transition-all duration-500',
        className,
      )}
    >
      <div className="absolute top-0 -right-1/2 z-0 size-full cursor-pointer bg-[linear-gradient(to_right,oklch(0.65_0.25_35/0.1)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.65_0.25_35/0.1)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px]"></div>

      <div className="text-primary/5 group-hover:text-primary/10 absolute right-1 bottom-3 scale-[6] transition-all duration-700 group-hover:scale-[6.2]">
        {icon}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between">
        <div>
          {access && (
            <div className="absolute top-4 right-4 z-20">
              <span
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-full',
                  access === 'Paid'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-muted text-muted-foreground border border-border'
                )}
              >
                {access === 'Paid' ? 'PRO' : 'FREE'}
              </span>
            </div>
          )}
          <div className="bg-primary/10 text-primary shadow-primary/10 group-hover:bg-primary/20 group-hover:shadow-primary/20 mb-4 flex h-12 w-12 items-center justify-center rounded-full shadow transition-all duration-500">
            {icon}
          </div>
          <h3 className="mb-2 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="text-primary mt-4 flex items-center text-sm">
          <span className="mr-1">Learn more</span>
          <ArrowRight className="size-4 transition-all duration-500 group-hover:translate-x-2" />
        </div>
      </div>
      <div className="from-primary to-primary/30 absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r blur-2xl transition-all duration-500 group-hover:blur-lg" />
    </motion.div>
  );
};

interface BentoGridProps {
  items: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    span?: number;
    access?: 'Free' | 'Paid';
  }>;
}

export function BentoGrid({ items }: BentoGridProps) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            icon={item.icon}
            span={item.span || 2}
            access={item.access}
            className={cn(
              'h-full',
              item.span === 4 && 'md:col-span-4',
              item.span === 3 && 'md:col-span-3',
              item.span === 2 && 'md:col-span-2',
            )}
          />
        ))}
      </motion.div>
    </div>
  );
}

