using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Projeto
    {
        public int Id {get; set;}

        [Required]
        public string Nome {get; set;} = string.Empty;

        public string Descricao {get; set;} = string.Empty;

        public string StatusTag {get; set;} = "Em Desenvolvimento";

        public int Progresso {get; set;} = 0; // PORCENTAGEM DE ZERO A 100

        public DateTime CriadoEm {get; set;} = DateTime.UtcNow;
    }
}