
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { CreditCard, Clock, CheckCircle, DollarSign } from "lucide-react";

interface PaymentStage {
  id: number;
  projectId: number;
  stageName: string;
  stagePercentage: number;
  amount: string;
  requiredProgress: number;
  status: string;
  paymentLink?: string;
  mercadoPagoId?: string;
  dueDate?: string;
  paidDate?: string;
  createdAt: string;
}

interface PaymentStagesManagementProps {
  projectId: number;
  projectProgress: number;
}

export default function PaymentStagesManagement({ 
  projectId, 
  projectProgress 
}: PaymentStagesManagementProps) {
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStages();
  }, [projectId]);

  const fetchStages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/payment-stages`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStages(data);
      }
    } catch (error) {
      console.error("Error fetching payment stages:", error);
    }
  };

  const generatePaymentLink = async (stageId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payment-stages/${stageId}/generate-link`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchStages(); // Refresh data
      }
    } catch (error) {
      console.error("Error generating payment link:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (stageId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payment-stages/${stageId}/complete`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchStages(); // Refresh data
      }
    } catch (error) {
      console.error("Error marking as paid:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const },
      available: { label: "Disponible", variant: "default" as const },
      paid: { label: "Pagado", variant: "success" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "available":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Etapas de Pago
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Progreso del Proyecto: {projectProgress}%
          </div>
          <Progress value={projectProgress} className="w-full" />
          
          {/* Explicación simple del proceso */}
          <div className="bg-gray-50 border rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">📋 ¿Cómo funciona?</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• Tu proyecto se divide en 4 etapas de pago</div>
              <div>• Cada etapa se activa cuando el proyecto avanza</div>
              <div>• Recibes notificación cuando puedes pagar la siguiente etapa</div>
            </div>
          </div>

          {/* Información del proceso de pago */}
          {stages.some((stage) => stage.status === 'available' && stage.paymentLink) && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    ¡Pago Disponible! 💳
                  </h4>
                  <p className="text-sm text-green-800">
                    Una nueva etapa está lista para pagar. Haz clic en "Pagar Ahora" abajo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {stages.some((stage) => stage.status === 'available' && !stage.paymentLink) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">
                    Preparando Link de Pago ⏳
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Tu administrador está preparando el link de pago. En breve estará disponible.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(stage.status)}
                  <div>
                    <div className="font-medium">{stage.stageName}</div>
                    <div className="text-sm text-muted-foreground">
                      {stage.stagePercentage}% - ${parseFloat(stage.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Requerido: {stage.requiredProgress}% progreso
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(stage.status)}
                  
                  {stage.status === "available" && stage.paymentLink && (
                    <Button
                      size="sm"
                      onClick={() => window.open(stage.paymentLink, "_blank")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar Ahora
                    </Button>
                  )}

                  {stage.status === "available" && !stage.paymentLink && (
                    <div className="text-sm text-muted-foreground">
                      Esperando link de pago...
                    </div>
                  )}

                  {stage.status === "paid" && stage.paidDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Pagado: {new Date(stage.paidDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
