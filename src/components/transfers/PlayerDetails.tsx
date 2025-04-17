import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { HirePlayerForm } from "@/components/transfers/HirePlayerForm";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransferOfferForm } from "./TransferOfferForm";
import { Club } from "@/types/club";
import { PayClauseForm } from "./PayClauseForm";
import { useApp } from "@/contexts/AppContext";

interface PlayerDetailsProps {
  player: {
    id: string;
    name: string;
    age: number;
    nationality: string;
    position: string;
    overall: number;
    potential: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    physical: number;
    salario_atual: number;
    valor_mercado: number;
    valor_clausula: number;
    salario_minimo: number;
    salario_maximo: number;
    morale: number;
    form: number;
    level: number;
    is_star_player: boolean;
    is_on_loan: boolean;
    loan_from_club: {
      id: string;
      name: string;
    } | null;
    club: {
      id: string;
      name: string;
      user: {
        id: string;
        name: string;
      };
    } | null;
    acoes_disponiveis: {
      pode_contratar: boolean;
      pode_pagar_clausula: boolean;
      pode_emprestar: boolean;
    };
  };
  club?: Club;
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerDetails({
  player,
  club,
  isOpen,
  onClose,
}: PlayerDetailsProps) {
  const [showHireForm, setShowHireForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showPayClauseForm, setShowPayClauseForm] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const { server } = useApp();

  // Função para determinar a cor do badge de forma
  const getFormColor = (form: number) => {
    if (form >= 80) return "bg-green-500";
    if (form >= 60) return "bg-green-400";
    if (form >= 40) return "bg-yellow-400";
    if (form >= 20) return "bg-orange-400";
    return "bg-red-500";
  };

  // Função para determinar a cor do badge de moral
  const getMoraleColor = (morale: number) => {
    if (morale >= 80) return "bg-green-500";
    if (morale >= 60) return "bg-green-400";
    if (morale >= 40) return "bg-yellow-400";
    if (morale >= 20) return "bg-orange-400";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={`/flags/${player.nationality.toLowerCase()}.png`}
                alt={player.nationality}
              />
              <AvatarFallback>{player.nationality.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{player.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{player.position}</span>
                <span>•</span>
                <span>{player.age} anos</span>
                <span>•</span>
                <span>{player.nationality}</span>
                {player.is_star_player && (
                  <Badge
                    variant="outline"
                    className="bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    Estrela
                  </Badge>
                )}
                {player.is_on_loan && (
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-300"
                  >
                    Emprestado
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Detalhes do jogador {player.name}, {player.position}, {player.age}{" "}
            anos, {player.nationality}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="attributes">Atributos</TabsTrigger>
            <TabsTrigger value="contract">Contrato</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Informações Gerais</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Overall:</span>
                    <span className="font-medium">{player.overall}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potencial:</span>
                    <div className="flex items-center">
                      <span className="font-medium">{player.potential}</span>
                      {player.potential > player.overall && (
                        <div className="flex items-center text-green-600 ml-2">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          <span>+{player.potential - player.overall}</span>
                        </div>
                      )}
                      {player.potential < player.overall && (
                        <div className="flex items-center text-red-600 ml-2">
                          <TrendingDown className="h-4 w-4 mr-1" />
                          <span>{player.potential - player.overall}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nível:</span>
                    <span className="font-medium">{player.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Forma:</span>
                    <Badge
                      className={`${getFormColor(player.form)} text-white`}
                    >
                      {player.form}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Moral:</span>
                    <Badge
                      className={`${getMoraleColor(player.morale)} text-white`}
                    >
                      {player.morale}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Valores</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Valor de mercado:
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.valor_mercado)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cláusula:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.valor_clausula)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Salário atual:
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.salario_atual)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Faixa salarial:
                    </span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.salario_minimo)}
                      {" - "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(player.salario_maximo)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="attributes" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Atributos Técnicos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocidade:</span>
                    <span className="font-medium">{player.pace}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Finalização:</span>
                    <span className="font-medium">{player.shooting}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passe:</span>
                    <span className="font-medium">{player.passing}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drible:</span>
                    <span className="font-medium">{player.dribbling}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Atributos Físicos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Defesa:</span>
                    <span className="font-medium">{player.defending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Físico:</span>
                    <span className="font-medium">{player.physical}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Clube Atual</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clube:</span>
                    <span className="font-medium">
                      {player.club ? player.club.name : "Livre"}
                    </span>
                  </div>
                  {player.club && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Treinador:</span>
                      <span className="font-medium">
                        {player.club.user.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {player.is_on_loan && player.loan_from_club && (
                <div>
                  <h3 className="font-semibold mb-2">Empréstimo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Clube de origem:
                      </span>
                      <span className="font-medium">
                        {player.loan_from_club.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          {!player.club && (
            <Button onClick={() => setShowHireForm(true)}>
              Contratar Jogador
            </Button>
          )}
          {player.club && player.club.id !== club?.id && (
            <>
              <Button onClick={() => setShowOfferForm(true)}>
                Enviar Proposta
              </Button>
              {server?.activate_clause && (
                <Button onClick={() => setShowPayClauseForm(true)}>
                  Pagar Multa Rescisória
                </Button>
              )}
            </>
          )}
        </div>

        <Dialog open={showHireForm} onOpenChange={setShowHireForm}>
          <DialogContent>
            <DialogTitle>Contratar Jogador</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para contratar o jogador {player.name}
            </DialogDescription>
            <HirePlayerForm
              player={player}
              onSuccess={() => setShowHireForm(false)}
              onCancel={() => setShowHireForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showOfferForm} onOpenChange={setShowOfferForm}>
          <DialogContent>
            <DialogTitle>Enviar Proposta de Transferência</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para enviar uma proposta de transferência
              para {player.name}
            </DialogDescription>
            <TransferOfferForm
              player={player}
              onSuccess={() => setShowOfferForm(false)}
              onCancel={() => setShowOfferForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showPayClauseForm} onOpenChange={setShowPayClauseForm}>
          <DialogContent>
            <DialogTitle>Pagar Multa Rescisória</DialogTitle>
            <DialogDescription>
              Confirme o pagamento da multa rescisória para contratar{" "}
              {player.name}
            </DialogDescription>
            <PayClauseForm
              player={{
                id: player.id,
                name: player.name,
                contract: {
                  clause_value: player.valor_clausula,
                },
              }}
              onSuccess={() => {
                setShowPayClauseForm(false);
                onClose();
              }}
              onCancel={() => setShowPayClauseForm(false)}
            />
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
