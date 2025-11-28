#include <stdlib.h>
#include <stdio.h>

int main() {
    char *cmd = getenv("RUNME");
    if (cmd) {
        system(cmd); // unsafely run command as root (simulate vuln)
    } else {
        printf("No RUNME set\n");
    }
    return 0;
}
