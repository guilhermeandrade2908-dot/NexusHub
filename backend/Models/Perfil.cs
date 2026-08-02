namespace Backend.Models
{
    public class Perfil
    {
        public int Id {get; set;}

        public string Nome {get; set;} = string.Empty;
        public string Cargo {get; set;} = string.Empty;
        public string Bio {get; set;} = string.Empty;

        public DateTime atualizadoEm {get; set;} = DateTime.UtcNow;
    }
}