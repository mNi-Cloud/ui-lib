import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/registry/new-york/ui/card'
import { Button } from "@/registry/new-york/ui/button"
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl';

interface Resource {
  title: string;
  icon: LucideIcon;
  description: string;
  link: string;
}

interface ServiceIndexProps {
  title: string;
  description: string;
  resources: Resource[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonLink?: string;
}

const ServiceIndex: React.FC<ServiceIndexProps> = ({
  title,
  description,
  resources,
  primaryButtonText = "",
  secondaryButtonText = "",
  primaryButtonLink = "#",
  secondaryButtonLink = "#",
}) => {
  const t = useTranslations('service.index')

  return (
    <div className="bg-background">
      <div className="w-full border-b">
        <div className="px-4 py-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {description}
          </p>
          <div className="mt-8 space-x-4">
            <Button size="lg" asChild>
              <Link href={primaryButtonLink}>
                {primaryButtonText}
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={secondaryButtonLink}>
                {secondaryButtonText}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource, index) => (
            <Card key={index} className="transition-colors hover:bg-accent">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <resource.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                </div>
                <CardDescription className="mt-2">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href={resource.link}>
                    {t('detail')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceIndex;