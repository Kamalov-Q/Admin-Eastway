import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/api/axios";
import { Globe, Building2, Map, Hotel, Star, FileText } from "lucide-react";

interface Stats {
  countries: number;
  cities: number;
  tours: number;
  hotels: number;
  reviews: number;
  requests: number;
}

export default function StatisticsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["statistics"],
    queryFn: async () => {
      const response = await axiosInstance.get("/statistics");
      return response.data as Stats;
    },
  });

  const cards = [
    {
      title: "Countries",
      count: stats?.countries || 0,
      icon: Globe,
      color: "bg-blue-500",
      lightColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Cities",
      count: stats?.cities || 0,
      icon: Building2,
      color: "bg-purple-500",
      lightColor: "bg-purple-50",
      textColor: "text-purple-600",
    },
    {
      title: "Tours",
      count: stats?.tours || 0,
      icon: Map,
      color: "bg-green-500",
      lightColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Hotels",
      count: stats?.hotels || 0,
      icon: Hotel,
      color: "bg-orange-500",
      lightColor: "bg-orange-50",
      textColor: "text-orange-600",
    },
    {
      title: "Reviews",
      count: stats?.reviews || 0,
      icon: Star,
      color: "bg-yellow-500",
      lightColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Requests",
      count: stats?.requests || 0,
      icon: FileText,
      color: "bg-red-500",
      lightColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {card.count.toLocaleString()}
                  </p>
                </div>
                <div className={`${card.lightColor} p-4 rounded-full`}>
                  <Icon className={`${card.textColor}`} size={28} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
