import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { TestTube, CheckCircle, XCircle } from "lucide-react";

const SAMPLE_EMAIL = {
  subject: "Transaction Alert: Rs. 1,250.00 debited",
  body: `Dear Customer,
  
Your account XXXXXX1234 has been debited with INR 1,250.00 on 15 Jan 2024.

Transaction Details:
Amount: Rs. 1,250.00
Merchant: Swiggy
Payment Mode: UPI
Date: 15-01-2024

Your available balance is Rs. 45,750.00

This is an auto-generated email. Please do not reply.

Thank you,
HDFC Bank`,
  sender: "alerts@hdfcbank.com",
};

export default function EmailParserTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(SAMPLE_EMAIL.subject);
  const [body, setBody] = useState(SAMPLE_EMAIL.body);
  const [sender, setSender] = useState(SAMPLE_EMAIL.sender);
  const [parseResult, setParseResult] = useState<any>(null);

  const parseMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, sender }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse email");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setParseResult(data);
      if (data.success) {
        toast({
          title: "Email Parsed Successfully",
          description: "Transaction details extracted from email.",
        });
      } else {
        toast({
          title: "Parsing Failed",
          description: data.message || "Could not parse transaction details.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const parseAndCreateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/email/parse-and-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, sender, emailId: "test-email-id" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to parse and create expense");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
        queryClient.invalidateQueries({ queryKey: ["/api/expenses/stats/summary"] });
        toast({
          title: "Expense Created",
          description: `Added ₹${parseFloat(data.expense.amount).toFixed(2)} expense from ${data.expense.merchant}`,
        });
        setParseResult(data);
      } else {
        toast({
          title: "Failed to Create Expense",
          description: data.message || "Could not parse transaction details.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loadSample = () => {
    setSubject(SAMPLE_EMAIL.subject);
    setBody(SAMPLE_EMAIL.body);
    setSender(SAMPLE_EMAIL.sender);
    setParseResult(null);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Email Parser
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Test the email parsing functionality with sample or custom emails
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadSample} data-testid="button-load-sample">
            Load Sample
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sender">Sender Email</Label>
            <Input
              id="sender"
              type="email"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="alerts@hdfcbank.com"
              data-testid="input-sender"
            />
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Transaction Alert: Rs. 1,250.00 debited"
              data-testid="input-subject"
            />
          </div>

          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body..."
              className="min-h-[200px] font-mono text-sm"
              data-testid="textarea-body"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => parseMutation.mutate()}
            disabled={parseMutation.isPending || !subject || !body || !sender}
            data-testid="button-test-parse"
          >
            {parseMutation.isPending ? "Parsing..." : "Test Parse"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => parseAndCreateMutation.mutate()}
            disabled={parseAndCreateMutation.isPending || !subject || !body || !sender}
            data-testid="button-parse-and-create"
          >
            {parseAndCreateMutation.isPending ? "Creating..." : "Parse & Create Expense"}
          </Button>
        </div>

        {parseResult && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              {parseResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Parsing Successful</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span className="font-medium">Parsing Failed</span>
                </>
              )}
            </div>

            {parseResult.transaction && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Merchant:</span>
                  <span className="font-medium">{parseResult.transaction.merchant}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{parseFloat(parseResult.transaction.amount).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <Badge variant="secondary">{parseResult.transaction.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <Badge variant="outline">{parseResult.transaction.paymentMethod}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {new Date(parseResult.transaction.date).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {parseResult.expense && (
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium text-green-600">
                  Expense created successfully with ID: {parseResult.expense.id}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
