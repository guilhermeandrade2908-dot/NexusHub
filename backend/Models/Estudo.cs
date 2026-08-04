using System;

namespace backend.Models
{
    public class Estudo
    {
        public int Id {get; set;}

        public string Materia {get; set;} = string.Empty;

        public double HorasHoje {get; set;} = 0;

        public double MetaHorasSemanal {get; set;} = 0;

        public DateTime UltimaAtualizacao {get; set;} = DateTime.UtcNow;
    }
}