using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Lazer
    {
        public int Id {get; set;}

        [Required]
        public string Tipo {get; set;} = string.Empty; // jogos, livros, filmes ou series

        [Required]
        public string Nome {get; set;} = string.Empty;
        
        public string Status {get; set;} = "Planejado";

        public DateTime CriadoEm {get; set;} = DateTime.UtcNow;
    }
}