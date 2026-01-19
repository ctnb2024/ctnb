
import { LeadData, IntegrationResponse } from '../types';

export class LeadService {
  private static readonly WEB3FORMS_KEY = "3aa90e3e-6bab-496f-b86d-5a5ae7443b1c";
  private static readonly WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

  // CONFIGURAÇÃO CLOUDINARY
  // ATUALIZADO: O nome deve ser IDÊNTICO ao que aparece na coluna "Nome" do seu painel Cloudinary.
  private static readonly CLOUDINARY_CLOUD_NAME = "dlx1oga0u"; 
  private static readonly CLOUDINARY_UPLOAD_PRESET = "CTNB - Leads"; 

  /**
   * Realiza o upload do arquivo para o Cloudinary e retorna a URL segura.
   */
  private static async uploadToCloudinary(file: File): Promise<string> {
    // Usamos 'auto' para permitir PDF e Imagens automaticamente
    const url = `https://api.cloudinary.com/v1_1/${this.CLOUDINARY_CLOUD_NAME}/auto/upload`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.CLOUDINARY_UPLOAD_PRESET);
    // Removemos 'tags' para evitar erros de validação se o preset não permitir tags explicitamente
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("Erro detalhado Cloudinary:", err);
        
        // Mapeamento de erros comuns para mensagens em português
        const msg = err.error?.message || "";
        if (msg.includes("Invalid upload_preset")) {
          throw new Error(`Nome do Preset incorreto. O código enviou "${this.CLOUDINARY_UPLOAD_PRESET}", mas o Cloudinary recusou. Verifique se há espaços extras no nome no painel.`);
        }
        if (msg.includes("unsigned upload")) {
          throw new Error("O Preset existe, mas o modo 'Sem assinatura' (Unsigned) não está ativo nas configurações dele.");
        }
        
        throw new Error(`Erro Cloudinary: ${msg || response.statusText}`);
      }

      const data = await response.json();
      return data.secure_url; 
    } catch (error: any) {
      console.error("Falha no upload:", error);
      throw new Error(error.message || "Falha na conexão com a nuvem.");
    }
  }

  static async submitLead(data: LeadData): Promise<IntegrationResponse> {
    try {
      // 1. Upload do Documento (se existir)
      let documentLink = "Nenhum documento anexado.";
      
      if (data.documento) {
        documentLink = await this.uploadToCloudinary(data.documento);
      }

      // 2. Envio dos dados
      return await this.sendToWeb3Forms(data, documentLink);

    } catch (error: any) {
      console.error("Erro no fluxo de envio:", error);
      return { 
        success: false, 
        message: error.message || "Erro desconhecido ao processar solicitação." 
      };
    }
  }

  private static async sendToWeb3Forms(data: LeadData, docUrl: string): Promise<IntegrationResponse> {
    // 1. Removemos a linha "Empresa"
    // 2. Mantemos apenas um local para o link do documento
    const messageBody = `
NOVO LEAD - PORTAL CTNB
=======================
Nome: ${data.nome_completo}
Revendedor: ${data.revendedor}
Telefone: ${data.telefone}
E-mail: ${data.email}
Link WhatsApp: https://wa.me/55${data.telefone.replace(/\D/g, '')}

DOCUMENTO ANEXADO (Link Seguro):
${docUrl}
`.trim();

    const payload = {
      access_key: this.WEB3FORMS_KEY,
      subject: `Novo Lead: ${data.nome_completo} - ${data.revendedor}`,
      from_name: "Portal CTNB",
      botcheck: "", 
      name: data.nome_completo,
      email: data.email,
      message: messageBody,
      // REMOVIDO: "Link Documento" e "Revendedor" daqui para evitar duplicidade no rodapé do e-mail.
      // O Web3Forms já envia tudo que está no 'message'.
    };

    const response = await fetch(this.WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        message: "Enviado com sucesso!",
        integrationId: result.id
      };
    } else {
      throw new Error(result.message || "O servidor recusou os dados.");
    }
  }

  static validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  }

  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
