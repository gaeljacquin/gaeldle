import { Badge } from "@/components/ui/badge";

type MyBadgeGroupProps = {
  text: string;
  backgroundClass: string;
}[];

export default function MyBadgeGroup({ group }: { group: MyBadgeGroupProps }) {
  return (
    <div className="flex space-x-4 w-full justify-center items-center text-center">
      {group.map((item, index) => (
        <Badge
          key={item.text + "-" + index}
          className={`text-md ${item.backgroundClass} hover:${item.backgroundClass}`}
        >
          {item.text}
        </Badge>
      ))}
    </div>
  );
}
