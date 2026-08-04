using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Perfil> Perfis { get; set; }
        public DbSet<Projeto> Projetos { get; set; }
        public DbSet<Estudo> Estudos { get; set; }
        public DbSet<Meta> Metas {get; set;}

    }
}
