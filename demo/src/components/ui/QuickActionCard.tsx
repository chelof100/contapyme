import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Target, 
  Folder, 
  CreditCard, 
  Package, 
  ShoppingCart, 
  ChefHat,
  TrendingUp,
  Star,
  Clock,
  Activity
} from 'lucide-react';

interface QuickActionRecommendation {
  name: string;
  href: string;
  icon: string;
  color: string;
  score: number;
  reason: string;
  frequency: number;
}

interface QuickActionCardProps {
  action: QuickActionRecommendation;
  onActionClick?: (action: QuickActionRecommendation) => void;
  showDetails?: boolean;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    FileText,
    Users,
    Target,
    Folder,
    CreditCard,
    Package,
    ShoppingCart,
    ChefHat,
    TrendingUp,
    Activity
  };
  return iconMap[iconName] || FileText;
};

const getScoreColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 bg-green-100';
  if (score >= 0.6) return 'text-blue-600 bg-blue-100';
  if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
  return 'text-gray-600 bg-gray-100';
};

const getScoreLabel = (score: number) => {
  if (score >= 0.8) return 'Muy Recomendado';
  if (score >= 0.6) return 'Recomendado';
  if (score >= 0.4) return 'Moderado';
  return 'Básico';
};

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  action,
  onActionClick,
  showDetails = false
}) => {
  const IconComponent = getIconComponent(action.icon);

  const handleClick = () => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${action.color} text-white`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">{action.name}</CardTitle>
              {showDetails && (
                <CardDescription className="text-xs">
                  {action.reason}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {action.score > 0.5 && (
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
            )}
            <Badge 
              variant="outline" 
              className={`text-xs ${getScoreColor(action.score)}`}
            >
              {getScoreLabel(action.score)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {showDetails ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Frecuencia de uso:</span>
              <span className="font-medium">{action.frequency} veces</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Score de recomendación:</span>
              <span className="font-medium">{(action.score * 100).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${action.score * 100}%` }}
              ></div>
            </div>
            <Link to={action.href}>
              <Button 
                size="sm" 
                className="w-full"
                onClick={handleClick}
              >
                Ir a {action.name}
              </Button>
            </Link>
          </div>
        ) : (
          <Link to={action.href}>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={handleClick}
            >
              Acceder
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickActionCard; 