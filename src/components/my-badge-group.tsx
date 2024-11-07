import { Badge } from '@/components/ui/badge';

type BadgeProps = {
  text: string;
  backgroundClass: string;
};

type MyBadgeGroupProps = BadgeProps[];

type MyBadgeGroupExtendedProps = {
  textColor?: string;
} & {
  group: MyBadgeGroupProps;
};

export default function MyBadgeGroup({ group, ...props }: MyBadgeGroupExtendedProps) {
  const { textColor } = props;
  const textColorClass = `text-${textColor ?? 'white'}`;

  return (
    <div className="flex space-x-4 w-full justify-center items-center text-center">
      {group.map((item, index) => (
        <Badge
          key={item.text + '-' + index}
          className={`text-md ${textColorClass} ${item.backgroundClass} hover:${item.backgroundClass}`}
        >
          {item.text}
        </Badge>
      ))}
    </div>
  );
}
