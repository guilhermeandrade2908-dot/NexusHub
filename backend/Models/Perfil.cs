namespace backend.Models
{
    public class Perfil
    {
        public int Id {get; set;}

        public string Nome {get; set;} = string.Empty;
        public string Cargo {get; set;} = string.Empty;
        public string Bio {get; set;} = string.Empty;
        public string Status {get; set;} = "Online";
        public int? ProjetoFocoId {get; set;}
        public Projeto? ProjetoFoco {get; set;}
        public DateTime AtualizadoEm {get; set;} = DateTime.UtcNow;
    }
}