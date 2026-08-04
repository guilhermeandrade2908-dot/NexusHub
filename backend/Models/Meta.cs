using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Meta
    {
        public int Id {get; set;}

        [Required]
        public string Texto {get; set;} = string.Empty;

        public bool Concluida {get; set;} = false;

        public DateTime CriadoEm {get; set;} = DateTime.UtcNow;
    }
}