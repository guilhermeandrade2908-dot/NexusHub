using System;

namespace backend.Models
{
    public class EstudoGlobal
    {
        public int Id {get; set;}

        public double HorasHoje {get; set;} = 0;

        public double HorasTotais {get; set;} = 0;

        public double MetaHorasSemanal {get; set;} = 0;

        public DateTime? UltimoReset {get; set;}

        public DateTime? UltimoResetSemanal {get; set;}

        public DateTime UltimaAtualizacao {get; set;} = DateTime.UtcNow;
    }
}