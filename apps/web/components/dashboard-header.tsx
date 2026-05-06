import { Icon } from '@tabler/icons-react';

interface DashboardPageHeaderProps {
  title: string;
  description: string;
  icon: Icon;
}

export function DashboardPageHeader(props: Readonly<DashboardPageHeaderProps>) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
        <props.icon size={22} className="text-primary" aria-hidden="true" />
        {props.title}
      </h1>
      <p className="text-sm text-muted-foreground">{props.description}</p>
    </div>
  );
}
